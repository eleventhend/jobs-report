# elmr.config
# The ELMR configuration file.
#
# Author:   Benjamin Bengfort <benjamin@bengfort.com>
# Created:  Thu Apr 09 08:44:18 2015 -0400
#
# Copyright (C) 2015 University of Maryland
# For license information, see LICENSE.txt
#
# ID: config.py [] benjamin@bengfort.com $

"""
The ELMR configuration file.
"""

##########################################################################
## Imports
##########################################################################

import os

from elmr.exceptions import ImproperlyConfigured

##########################################################################
## Constants and Helper Functions
##########################################################################


ENVIRON_PREFIX = "ELMR"


def settings(name, default=None, prefix=ENVIRON_PREFIX):
    """
    Fetches the setting from the an environment variable by prepending
    the prefix, if not found, sets the default value.
    """
    envvar = "%s_%s" % (prefix.upper(), name.upper())
    if envvar in os.environ:
        return os.environ[envvar]
    return default


def get_settings_object(default, envvar="settings", prefix=ENVIRON_PREFIX):
    """
    Returns the correct settings object string by inspecting an environment
    variable (prefixed by the ENVIRON_PREFIX) for the words "production",
    "development", or "testing". Raises an error if these aren't found. You
    must specify a default string in case the environment doesn't contain
    the correct variable. Usage in Flask would be as follows:

        app = Flask(__name__)
        app.config.from_object(get_settings_object("development"))

    This will look for an envvar, ELMR_SETTINGS and if it is set, will return
    that configuration string, e.g. "elmr.config.ProductionConfig". Otherwise
    it will return the default, in this case, "elmr.config.DevelopmentConfig".
    """

    mode = settings(envvar, default, prefix).lower()
    pkg  = "elmr.config"
    jump = {
        "production": "%s.%s" % (pkg, ProductionConfig.__name__),
        "development": "%s.%s" % (pkg, DevelopmentConfig.__name__),
        "testing": "%s.%s" % (pkg, TestingConfig.__name__),
    }

    if mode not in jump:
        raise ImproperlyConfigured("Could not load settings for name '%s'!\n"
                                   "Use 'production', 'development', or "
                                   "'testing' to properly configure." % mode)
    return jump[mode]


##########################################################################
## Configuration Object
##########################################################################


class Config(object):
    """
    Default configuration for ELMR application
    """

    DEBUG     = settings("debug", False)
    TESTING   = settings("testing", False)


class ProductionConfig(Config):
    """
    Production specific settings for ELMR application
    """
    pass


class DevelopmentConfig(Config):
    """
    Development specific settings for ELMR application
    """

    DEBUG     = True


class TestingConfig(DevelopmentConfig):
    """
    Testing settings for travis-ci and other tests
    """

    TESTING   = True
